import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51NZY7XIxYFeKkZkriMU15Agim8DD0akOvZCU64LeGd1iPSJgV8xmrBOBeFg53AlJgrtGCKpciTaMNvOSy6B74vlV005mGnaRSN'
);

export const bookTour = async (tourId) => {
  try {
    //1. Get the session from the server
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    //2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
