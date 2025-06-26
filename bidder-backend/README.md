# Real-Time Bidding System

This is a backend for a real-time bidding system built with NestJS, PostgreSQL, and WebSockets.

## Features
- JWT Authentication
- Item auction management
- Real-time bidding with WebSockets
- Auction expiration handling
- 100 pre-seeded users
- Bid validation and security

## Prerequisites
- Node.js (v16+)
- PostgreSQL
- NestJS CLI (`npm i -g @nestjs/cli`)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your/repo.git
cd real-time-bidding
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment
Create a `.env` file in the root directory:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=bidding_db
JWT_SECRET=your_secret_key
```

### 4. Start PostgreSQL

Ensure PostgreSQL is running on your system.

### 5. Run the application

```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /auth/login`

```json
{
  "username": "user1",
  "password": "password1"
}
```

### Items

- `POST /items (Protected)`

```json
{
  "name": "Antique Vase",
  "description": "18th century artifact",
  "startingPrice": 100.00,
  "duration": 3600 // in seconds
}
```

### Bids

- `POST /items/:itemId/bids (Protected)`

```json
{
  "amount": 150.00
}
```

## Real-Time Updates

Connect via WebSocket to `ws://localhost:3000`:

```javascript
const socket = io('http://localhost:3000');

// Join item room
socket.emit('joinItemRoom', { itemId: 1 });

// Listen for bids
socket.on('newBid', (data) => {
  console.log(`New bid: $${data.amount} on item ${data.itemId}`);
});
```

## Swagger Documentation

The API is documented with Swagger. Once the application is running, the Swagger UI can be accessed at [http://localhost:3000/api](http://localhost:3000/api).


## User Credentials

100 users are pre-seeded with credentials:

- Usernames: `user1` to `user100`
- Passwords: `password1` to `password100`

## Testing with cURL

### 1. Login to get JWT token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"password1"}'
```

### 2. Create auction item (use token from step 1)

```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Painting","description":"Original artwork","startingPrice":200,"duration":600}'
```

### 3. Place bid
```bash
curl -X POST http://localhost:3000/items/1/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"amount":250}'
```

## Project Structure

```
src/
├── auth/          # Authentication logic
├── users/         # User entities and services
├── items/         # Item management
├── bids/          # Bid functionality
├── app.module.ts  # Root module
└── main.ts        # Application entry point
```

## License

MIT


## Additional Setup Notes

### To Seed Users

Add this to your `users.service.ts`:

```typescript
async seedUsers() {
  const userCount = await this.usersRepository.count();
  if (userCount === 0) {
    const users = [];
    for (let i = 1; i <= 100; i++) {
      users.push(
        this.usersRepository.create({
          username: `user${i}`,
          password: await bcrypt.hash(`password${i}`, 10),
        })
      );
    }
    await this.usersRepository.save(users);
    console.log('Seeded 100 users');
  }
}
```

Call this method in your application bootstrap:
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const userService = app.get(UsersService);
  await userService.seedUsers();
  // ... rest of bootstrap code
}
```

### To Test WebSockets

Use a WebSocket client like [Socket.IO Client](https://socket.io/docs/v4/client-installation/) or [Postman WebSocket testing](https://learning.postman.com/docs/sending-requests/websocket/websocket/.
