// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import {
	getAuth, onAuthStateChanged,
	GoogleAuthProvider, signInWithPopup, signOut,
	RecaptchaVerifier, signInWithPhoneNumber,
	updateProfile
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

import {
	getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDwAbSvToTqKXGLLtRPtwc5Ne0yGX-rn1o",
	authDomain: "mess2-a7180.firebaseapp.com",
	projectId: "mess2-a7180",
	storageBucket: "mess2-a7180.appspot.com",
	messagingSenderId: "58898996535",
	appId: "1:58898996535:web:9dcb0b6bbdd32fe75d0eb2",
	measurementId: "G-RM541ZY8CJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth();

// verify if user is logged in
function check_login_and_goto_home() {
	onAuthStateChanged(auth, (user) => {
		if (user) {
			// User is signed in, see docs for a list of available properties
			// https://firebase.google.com/docs/reference/js/firebase.User
			const uid = user.uid;
			// ...
			console.log("User is logged in");
			console.log(user);
			if (window.location.pathname == "/") {
				window.location.href = "/home.html";
			}
			if (window.location.pathname == "/home.html") {
				get_user_data().then((data) => {
					window.phone = data.phone;
					update_phone_report();
					if (data.favorites) {
						window.favorites = data.favorites.split("\n");

					}
					// window.updateDOM();
					document.getElementById("smsalerts").checked = data.alerts;
				});
			}
		} else {
			// User is signed out
			// ...
			console.log("User is logged out");
			if (window.location.pathname != "/") {
				window.location.href = "/";
			}
		}
	});
}
const analytics = getAnalytics(app);

async function googleLogin() {
	//1 - init Google Auth Provider
	const provider = new GoogleAuthProvider();
	// console.log(provider);
	//2 - create the popup signIn
	const result = await signInWithPopup(auth, provider);
	// console.log(result);
	//3 - after the user logs in, we take the user ID token
	// const token = result.credential.accessToken;
	// console.log(token);
	//4 - we give the token to the backend
	console.log(result.user);

	if (result.user) {
		window.location.href = "/home.html";
	}
}
window.googleLogin = googleLogin;

async function logout() {
	await auth.signOut();
	localStorage.removeItem("@token");
	window.location.href = "/";
}
window.logout = logout;

async function register(e) {
	e.preventDefault();

	googleLogin();
	return false;
}

function setup_recaptcha() {
	const auth = getAuth();
	window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
		'size': 'invisible',
		'callback': (response) => {
			// reCAPTCHA solved, allow signInWithPhoneNumber.
			onSignInSubmit();
		}
	});
}
window.setup_recaptcha = setup_recaptcha;


function sign_in_phone(phone) {
	const phoneNumber = phone;
	const appVerifier = window.recaptchaVerifier;

	const auth = getAuth();
	signInWithPhoneNumber(auth, phoneNumber, appVerifier)
		.then((confirmationResult) => {
			// SMS sent. Prompt user to type the code from the message, then sign the
			// user in with confirmationResult.confirm(code).
			window.confirmationResult = confirmationResult;
			console.log("SMS sent");
		}).catch((error) => {
			// Error; SMS not sent
			// ...
			window.recaptchaVerifier.render().then(function (widgetId) {
				grecaptcha.reset(widgetId);
			});
		});
}
window.sign_in_phone = sign_in_phone;

function store_phone_in_user_data(phone) {
	// save in firestore
	const user = getAuth().currentUser;
	const db = getFirestore();

	const docRef = doc(db, "users", user.uid);
	console.log(docRef);

	setDoc(docRef, {
		phone: phone
	}, { merge: true }).then(() => {
		console.log("Phone saved");
	}).catch((error) => {
		console.error("Error writing document: ", error);
	}
	);
}
window.store_phone_in_user_data = store_phone_in_user_data;

async function get_phone_from_user_data() {
	const phone = get_user_data().then((userData) => {
		if (userData) {
			return userData.phone;
		}
	});
	return phone;
}

window.get_phone_from_user_data = get_phone_from_user_data;

async function get_user_data() {
	// get from firestore
	const user = getAuth().currentUser;
	const db = getFirestore();

	if (user) {
		const docRef = doc(db, 'users', user.uid);

		const userData = await getDoc(docRef).then((docSnapshot) => {
			if (docSnapshot.exists()) {
				const data = docSnapshot.data();
				console.log('User data found: ', docSnapshot.data());
				if (data.favorites) {
					favorites = data.favorites.split("\n")

				}
				updateDOM();
				return data;
			} else {
				console.log('User data not found.');
				return null;
			}
		})
		return userData;
	} else {
		console.log('User not authenticated.');
		return null;
	}
}

async function set_user_data(data) {
	// save in firestore
	const user = getAuth().currentUser;
	const db = getFirestore();

	const docRef = doc(db, "users", user.uid);
	console.log(docRef);

	return setDoc(docRef, data, { merge: true }).then(() => {
		console.log("Saved");
	}).catch((error) => {
		console.error("Error writing document: ", error);
	});
}

async function update_phone_report() {
	if (window.phone) {
		document.getElementById("phone").value = phone;
	} else {
		document.getElementById("phone_report").innerHTML = "Add phone number to receive SMS alerts.";
	}
}
window.update_phone_report = update_phone_report;

check_login_and_goto_home();

window.update_receive_check = function update_receive_check(e) {
	const alerts = e.checked;

	set_user_data({ alerts })
}

window.update_phone = function update_phone(e) {
	let phone = document.getElementById("phone").value
	if (phone) {
		// if country code is not present, add it
		if (phone[0] != "+") {
			phone = "+91" + phone;
		}
		set_user_data({ phone }).then(() => {
			window.phone = phone;
			update_phone_report();
		})
	}
}

window.get_fav_string = async function get_fav_string() {
	// get from firestore
	const fav = await get_user_data().then((userData) => {
		if (userData) {
			return userData.favorites;
		} else {
			return "";
		}
	});
	return fav;
}

window.set_fav_string = async function set_fav_string(fav) {
	return set_user_data({ favorites: fav });
}

window.send_msg = function send_msg() {
	// url encode the message
	const msg = encodeURIComponent(document.getElementById("message").value);
	console.log(msg);
	fetch(`/sendsms?message=${msg}`)
		.then((response) => {
			alert("Messages sent");
		}).catch((error) => {
			alert(error);
		}
		);
}


export { auth, check_login_and_goto_home, setup_recaptcha, update_phone_report };