import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (service account credentials required)
// const serviceAccount = require('../mess2-a7180-firebase-adminsdk-e1mw6-03e6e999f2.json'); // Replace with your own service account key file
import serviceAccount from '../mess2-a7180-firebase-adminsdk-e1mw6-03e6e999f2.json' assert { type: 'json' };
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mess2-a7180.firebaseio.com', // Replace with your Firestore database URL
});


// Get a reference to the Firestore database
const db = admin.firestore();

// Function to get all user data
async function getAllUserData() {
  try {
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();

    const userDataArray = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      userDataArray.push(userData);
    });

    return userDataArray;
  } catch (error) {
    console.error('Error getting all user data:', error);
    throw error;
  }
}

export { getAllUserData }