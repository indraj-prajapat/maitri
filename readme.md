# Maitri AI Project

This project contains a backend (Python/Flask) and frontend (Node.js/React). Follow the steps below to set up and run the project.

---

## Prerequisites

- Python 3.10+ (for backend)
- Node.js 18+ (for frontend)
- npm (comes with Node.js)
- Git Bash (for running `.sh` scripts on Windows) or a Linux/macOS terminal

---

## Setup Environment Variables

1. Create a `.env` file inside the `backend` folder:


2. Add your environment variables. Example:

variable needed are 
token = ###
grok_api_key = ###
grok2 = ###


> **Important:** Do **not** commit `.env` to version control if it contains sensitive keys.

---

## Run the Project

1. Open a git bash terminal and navigate to the project root:

```bash
cd path/to/maitri  # where backend and forntend folder exists

bash run_project.sh
```


## This script will:

### Create a virtual environment in backend/venv (if not already present)

### Install backend dependencies

### Activate the virtual environment

### Start the backend server

### Install frontend dependencies

### Start the frontend server


## after runing backend and frontend server you can proccedd to frontend server :- 
##   ➜  Local:   http://localhost:8080/
##   ➜  Network: http://192.168.137.1:8080/
##   ➜  Network: http://172.16.2.114:8080/