# Bidder Application (Frontend + Backend)

This repository contains the source code for the Bidder Application, which includes a React.js frontend and a Node.js (Express) backend. This project is configured to be built and deployed as a single, self-contained Docker image.

## Quick Start: Docker

The recommended way to build and run this application for production or testing is with Docker.

### Prerequisites

- Docker installed on your machine.

### Building the Docker Image

From the root directory of the project (where the `Dockerfile` is located), run the following command to build the image. This command packages both the frontend and backend into a single image named `bidder`.

```bash
docker build -t bidder .
```

### Setting up env

Create an env file with necessary variables.
```bash
cat > /tmp/bidder-conf.env << EOF
DB_HOST=10.158.219.254
DB_PORT=5432
DB_USERNAME=bidder
DB_PASSWORD=bidder
DB_DATABASE=bidder
JWT_SECRET=your_secret_key
PORT=8080
EOF
```

### Running the Container

Once the image is built, you can run it as a container. The application inside the container listens on the port specified by the PORT environment variable (defaulting to 3000), and the following command maps port 8080 on your host machine to the container's port.

```bash
docker run --env-file /tmp/bidder.env -p 8080:8080 --name bidder-app bidder
```

You should now be able to access the application by navigating to `http://localhost:8080` in your web browser.

### Development & Project Structure

This project is a monorepo containing two separate packages:

- `bidder-frontend/`: The React.js client application.
- `bidder-backend/`: The Node.js API server.

For detailed instructions on how to run each part of the application in a development environment (without Docker), please refer to their respective README files.
