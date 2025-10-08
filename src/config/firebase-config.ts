import * as admin from 'firebase-admin';
import serviceAccount from '../keys/service-account-key';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://musicplayer-2e752-default-rtdb.firebaseio.com',
});

export default admin;
