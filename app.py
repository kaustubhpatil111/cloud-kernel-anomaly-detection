import threading
import subprocess
import re
import pandas as pd
import numpy as np
import tensorflow as tf
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import time
import sys
import os
import logging
import signal
import psutil
from flask_cors import CORS



app = Flask(__name__)
CORS(app)  # This allows React to connect
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ---------- Configuration ----------
MODEL_PATH = 'models/lstm/DT-abnormal-lstm/model_0_00.ckpt'
TBL_PATH = 'data/syscall_64.tbl'
MAX_LEN = 200
WINDOW_SIZE = 200
UPDATE_INTERVAL = 2

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global variables
syscall_queue = []
anomaly_scores = []
lock = threading.Lock()
name_to_num = {}
num_to_name = {}
strace_process = None
target_pid = None

# ---------- Load syscall map ----------
def load_syscall_map(tbl_path):
    """Load syscall name to number mapping."""
    logger.info(f"Loading syscall map from {tbl_path}")
    
    try:
        df = pd.read_csv(tbl_path, comment='#', sep=r'\s+',
                         names=['number', 'abi', 'name', 'entry'])
        df = df[df['number'].apply(lambda x: str(x).isdigit())]
        df['number'] = df['number'].astype(int)
        df = df[df['abi'].isin(['64', 'common'])]
        syscall_map = dict(zip(df['name'], df['number']))
        
        # Create reverse map
        global num_to_name
        num_to_name = {v: k for k, v in syscall_map.items()}
        
        logger.info(f"Loaded {len(syscall_map)} syscalls")
        return syscall_map
    except Exception as e:
        logger.error(f"Failed to load syscall map: {e}")
        sys.exit(1)

# --- Replace your load_model function (Lines 72-104) with this version ---

def load_model(model_path):
    import tensorflow as tf
    import numpy as np

    class LegacyV1GraphWrapper:
        """
        Bypasses the broken Keras 3 object-tree tracking by extracting 
        the raw mathematical graph & weights directly using the V1 engine.
        """
        def __init__(self, path):
            # Create an isolated static graph context
            self.graph = tf.Graph()
            self.sess = tf.compat.v1.Session(graph=self.graph)
            
            with self.graph.as_default():
                logger.info("Extracting raw inference graph (ignoring training/optimizer states)...")
                meta_graph_def = tf.compat.v1.saved_model.loader.load(
                    self.sess,
                    [tf.compat.v1.saved_model.tag_constants.SERVING],
                    path
                )
                
                # Dynamically look up the serving signature 
                sig_key = 'serving_default'
                if sig_key not in meta_graph_def.signature_def:
                    sig_key = list(meta_graph_def.signature_def.keys())[0]
                    
                signature_def = meta_graph_def.signature_def[sig_key]
                
                # Discover structural tensor target names
                input_key = list(signature_def.inputs.keys())[0]
                output_key = list(signature_def.outputs.keys())[0]
                
                self.input_tensor = self.graph.get_tensor_by_name(signature_def.inputs[input_key].name)
                self.output_tensor = self.graph.get_tensor_by_name(signature_def.outputs[output_key].name)
                logger.info(f"Successfully mapped layers: {input_key} -> {output_key}")

        def predict(self, inputs, *args, **kwargs):
            # Feed data through the isolated static session execution path
            with self.graph.as_default():
                return self.sess.run(self.output_tensor, feed_dict={self.input_tensor: inputs})

    try:
        return LegacyV1GraphWrapper(model_path)
    except Exception as e:
        logger.error(f"Failed loading through legacy isolation layer: {e}")
        raise e
    

# ---------- Strace reader with proper syscall capture ----------
def strace_reader(pid):
    """Read syscalls from strace attached to the given PID."""
    global syscall_queue, strace_process
    
    logger.info(f"Starting strace reader for PID {pid}")
    
    # Set ptrace scope
    try:
        with open('/proc/sys/kernel/yama/ptrace_scope', 'r') as f:
            if f.read().strip() != '0':
                logger.warning("ptrace_scope is not 0. Run: echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope")
    except:
        pass
    
    # Try with sudo first, then without
    cmds = [

        ['strace', '-p', str(pid), '-f', '-e', 'trace=all', '-o', '/dev/stdout', '-s', '9999', '-v', '-tt']
    ]
    
    proc = None
    for cmd in cmds:
        logger.info(f"Trying: {' '.join(cmd)}")
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            # Check if it started
            time.sleep(0.5)
            if proc.poll() is None:
                strace_process = proc
                logger.info("Strace started successfully")
                break
        except Exception as e:
            logger.error(f"Failed: {e}")
            continue
    
    if proc is None:
        logger.error("Could not start strace")
        return
    
    # Multiple patterns to catch different strace output formats
    patterns = [
        re.compile(r'(\w+)\('),  # Simple: write(
        re.compile(r'\[\d+\]\s+(\w+)\('),  # [pid] write(
        re.compile(r'\d+\s+(\w+)\('),  # 12345 write(
        re.compile(r'\d+:\d+:\d+\.\d+\s+(\w+)\('),  # timestamp write(
    ]
    
    line_count = 0
    syscall_count = 0
    
    logger.info("Started reading strace output")
    
    for line in proc.stdout:
        line = line.strip()
        line_count += 1
        
        # Try each pattern
        for pattern in patterns:
            match = pattern.search(line)
            if match:
                syscall_name = match.group(1)
                
                # Get syscall number
                num = name_to_num.get(syscall_name)
                
                if num is not None:
                    with lock:
                        syscall_queue.append(num)
                        if len(syscall_queue) > WINDOW_SIZE * 2:
                            syscall_queue = syscall_queue[-WINDOW_SIZE:]
                    
                    syscall_count += 1
                    if syscall_count % 10 == 0:
                        logger.info(f"Captured {syscall_count} syscalls: {syscall_name}({num})")
                break
        
        if line_count % 1000 == 0:
            logger.debug(f"Read {line_count} lines, captured {syscall_count} syscalls")
    
    logger.error("Strace process ended")

# ---------- Anomaly scoring thread ----------
def scorer():
    """Periodically compute loss on current window and emit via SocketIO."""
    global anomaly_scores, socketio   # <-- ensure socketio is accessible
    
    logger.info("Starting scorer thread")
    loss_fn = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True, reduction='none')
    
    last_queue_size = 0
    no_progress = 0
    
    while True:
        time.sleep(UPDATE_INTERVAL)
        
        with lock:
            queue_size = len(syscall_queue)
            
            # Check progress
            if queue_size == last_queue_size:
                no_progress += 1
                if no_progress > 5 and queue_size == 0:
                    logger.warning("No syscalls being captured. Check if strace is working.")
            else:
                no_progress = 0
            
            last_queue_size = queue_size
            
            # Get last 20 syscalls for display
            last_20 = syscall_queue[-20:] if queue_size >= 20 else syscall_queue
            last_names = [num_to_name.get(num, f"sys_{num}") for num in last_20]
            
            if queue_size < 10:
                logger.info(f"Collecting syscalls: {queue_size}/10")
                # Use the last known score to keep the graph flat, or 0 if it's the very beginning
                last_known_loss = anomaly_scores[-1] if anomaly_scores else 0.0 
                socketio.emit('update', {
                    'syscalls': last_20,
                    'syscall_names': last_names,
                    'loss': last_known_loss, 
                    'history': anomaly_scores,
                    'queue_size': queue_size,
                    'status': f'Collecting data... ({queue_size}/10)'
                })
            
            # Get window for model
            if queue_size >= WINDOW_SIZE:
                window = syscall_queue[-WINDOW_SIZE:]
            else:
                window = syscall_queue.copy()
            
            if len(window) < 2:
                continue
            
            # Prepare input/target
            inp = window[:-1]
            targ = window[1:]
            
            # Pad to MAX_LEN
            if len(inp) > MAX_LEN:
                inp = inp[:MAX_LEN]
                targ = targ[:MAX_LEN]
            else:
                inp = np.pad(inp, (0, MAX_LEN - len(inp)), constant_values=0)
                targ = np.pad(targ, (0, MAX_LEN - len(targ)), constant_values=0)
            
            inp_array = np.array([inp], dtype=np.int32)
            targ_array = np.array([targ], dtype=np.int32)
            
            try:
                # Model prediction
                pred = model.predict(inp_array, verbose=0)
                
                # Calculate loss
                loss = loss_fn(targ_array, pred).numpy()[0]
                avg_loss = float(np.mean(loss))
                
                logger.info(f"Anomaly score: {avg_loss:.6f}")
                
                # Update history
                anomaly_scores.append(avg_loss)
                if len(anomaly_scores) > 100:
                    anomaly_scores = anomaly_scores[-100:]
                
                # Emit to client - log before emit
                logger.info(f"Emitting update: loss={avg_loss:.6f}, queue={queue_size}")
                socketio.emit('update', {
                    'syscalls': last_20,
                    'syscall_names': last_names,
                    'loss': avg_loss,
                    'history': anomaly_scores,
                    'queue_size': queue_size,
                    'status': 'Monitoring'
                })
                
            except Exception as e:
                logger.error(f"Prediction error: {e}")



# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

@app.route('/')
def index():
    return render_template('index.html', pid=target_pid)

@app.route('/status')
def status():
    with lock:
        return {
            'queue_size': len(syscall_queue),
            'scores_count': len(anomaly_scores),
            'last_score': anomaly_scores[-1] if anomaly_scores else 0,
            'pid': target_pid
        }

def cleanup(signum, frame):
    logger.info("Cleaning up...")
    if strace_process:
        strace_process.terminate()
    sys.exit(0)

# ---------- Main ----------
if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python app.py <PID>")
        print("Example: python app.py 1234")
        sys.exit(1)
    
    try:
        target_pid = int(sys.argv[1])
    except ValueError:
        print("Error: PID must be a number")
        sys.exit(1)
    
    # Register cleanup
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    logger.info(f"Target PID: {target_pid}")
    
    # Verify process exists
    try:
        process = psutil.Process(target_pid)
        logger.info(f"Monitoring process: {process.name()} (PID: {target_pid})")
    except psutil.NoSuchProcess:
        logger.error(f"Process {target_pid} not found")
        sys.exit(1)
    
    # Load syscall map
    name_to_num = load_syscall_map(TBL_PATH)
    
    # Load LSTM model
    model = load_model(MODEL_PATH)
    
    # Start strace reader thread
    t1 = threading.Thread(target=strace_reader, args=(target_pid,), daemon=True)
    t1.start()
    
    # Start scorer thread
    t2 = threading.Thread(target=scorer, daemon=True)
    t2.start()
    
    # Start web server
    logger.info("Starting web server on http://0.0.0.0:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)