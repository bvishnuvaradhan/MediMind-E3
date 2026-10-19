import socket

def check(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1.5)
    try:
        s.connect(('127.0.0.1', port))
        s.close()
        return True
    except Exception:
        return False

print("Port 27017 (MongoDB):", check(27017))
print("Port 5000 (Backend API Gateway):", check(5000))
print("Port 5173 (Frontend Vite):", check(5173))
