import axios from 'axios';

const BASE_URL = 'http://paynest-noble.lxd:3000';
const ITEM_ID = 2;
const STARTING_PRICE = 276;
const CONCURRENT_USERS = 100;

const USER_MAP = {};
const BID_MAP = {};

async function simulateBidding() {
  await Promise.allSettled(
    Array.from({ length: CONCURRENT_USERS }, (_, i) => {
      const userId = i + 1;
      return loginUser(userId)
    })
  );

  const promises = [];
  for (const [userId, token] of Object.entries(USER_MAP)) {
    promises.push(placeBidForUser(userId, token));
  }
  await Promise.all(promises);
}

async function loginUser(userId) {
  const username = `user${userId}`;
  const password = `password${userId}`;

  const loginResponse = await axios.post(
    `${BASE_URL}/auth/login`,
    { username, password },
    { headers: { 'Content-Type': 'application/json' } }
  );

  USER_MAP[userId] = loginResponse.data.access_token;
}

async function placeBidForUser(userId, token) {
  const bidAmount = STARTING_PRICE + Math.random() * 100;

  try {
    await axios.post(
      `${BASE_URL}/items/${ITEM_ID}/bids`,
      { amount: bidAmount },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(`User ${userId} placed $${bidAmount} bid successfully`);
    BID_MAP[userId] = true;

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`User ${userId} bid of $${bidAmount} failed: ${errorMessage}`);
    BID_MAP[userId] = false;
  }
}

simulateBidding().catch(console.error);
