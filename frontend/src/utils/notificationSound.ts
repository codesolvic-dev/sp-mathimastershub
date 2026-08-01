const NOTIFICATION_TUNE_SRC = encodeURI("/notification alert tune.mpeg");
const CUSTOMER_SUCCESS_TUNE_SRC = encodeURI(
  "/WhatsApp Audio 2026-07-15 at 8.46.28 PM.mpeg"
);

let notificationAudio: HTMLAudioElement | null = null;
let customerSuccessAudio: HTMLAudioElement | null = null;

function getNotificationAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  if (!notificationAudio) {
    notificationAudio = new Audio(NOTIFICATION_TUNE_SRC);
    notificationAudio.preload = "auto";
  }

  return notificationAudio;
}

function getCustomerSuccessAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  if (!customerSuccessAudio) {
    customerSuccessAudio = new Audio(CUSTOMER_SUCCESS_TUNE_SRC);
    customerSuccessAudio.preload = "auto";
  }

  return customerSuccessAudio;
}

/** Unlock audio after first user click (browser autoplay policy) */
export function unlockNotificationAudio() {
  const audio = getNotificationAudio();
  if (!audio) return;

  audio.muted = true;
  audio.currentTime = 0;
  void audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
  }).catch(() => {
    audio.muted = false;
  });

  const successAudio = getCustomerSuccessAudio();
  if (!successAudio) return;
  successAudio.muted = true;
  successAudio.currentTime = 0;
  void successAudio.play().then(() => {
    successAudio.pause();
    successAudio.currentTime = 0;
    successAudio.muted = false;
  }).catch(() => {
    successAudio.muted = false;
  });
}

/** Play custom notification tune on new order (admin) */
export function playOrderNotificationSound() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("adminNotificationSound") === "off") return;

  const audio = getNotificationAudio();
  if (!audio) return;

  audio.muted = false;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    /* Blocked until user interacts with the page */
  });
}

/** Play tune when customer completes an order or submits a review */
export function playCustomerSuccessSound() {
  if (typeof window === "undefined") return;

  const audio = getCustomerSuccessAudio();
  if (!audio) return;

  audio.muted = false;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    /* Blocked until user interacts with the page */
  });
}
