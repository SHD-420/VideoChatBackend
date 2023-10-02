# Video Chat Server

Http + Websocket backend for the [VideoChat application](https://github.com/SHD-420/VideoChatFrontend) I made.

## Prerequisites

Before getting started, make sure you have following installed on your system:

- **Node.js**: (v16+) as javascript runtime
- **PNPM**: as package manager
- **Redis**: as kv store for the application state

## Setup

1. Setup your .env file with as follows (all required):
    ```
    REDIS_USER=
    REDIS_PASSWORD=
    REDIS_HOST=
    REDIS_PORT=
    ```

1. Install the dependencies:

    ```bash
    pnpm install
    ```

1. Start the server:
    ```bash
    pnpm start
    ```
