import "base.scss";
import "core-js/stable";
import "regenerator-runtime/runtime";
import "loaders.css";
import "ress";
import jsQR from "jsqr";

const loader = document.getElementById("loader");
const camera = document.getElementById("camera");
const picture = document.getElementById("picture");
const qrStr = document.getElementById("qrStr");
const resetBtn = document.getElementById("resetBtn");

// スリープ
const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

// ローディング開始
export const startLoading = () => {
  loader.classList.remove("hidden");
  // 画面内の要素をクリックさせない
  document.body.onkeydown = (event) => event.preventDefault();
};

// ローディング終了
export const endLoading = () => {
  loader.classList.add("hidden");
  document.body.onkeydown = null;
};

// ローダーのテスト
// loadingButton.addEventListener("click", async () => {
//   startLoading();
//   await sleep(1000);
//   endLoading();
// });

const startCamera = () => {
  // カメラ設定
  const constraints = {
    // 音は取らない
    audio: false,
    video: {
      width: 300,
      height: 150,
      // フロントカメラを利用する
      facingMode: "user",
    },
  };

  // デバイスのカメラ操作
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      // 許可されたら
      // デバイスカメラを<video>と同期
      camera.srcObject = stream;
      // カメラが開始したら
      camera.onloadedmetadata = () => {
        // カメラ開始
        camera.play();
        // QRコードのチェック開始
        checkPicture();
      };
    })
    .catch((err) => {
      // カメラ使用を拒否されたりしたとき
      console.log(err.name + ": " + err.message);
    });
};

// 画面表示時にカメラ起動
window.addEventListener("load", startCamera);

// QRコードチェック
const checkPicture = () => {
  // canvasから描画用コンテキストオブジェクト取得
  const ctx = picture.getContext("2d");

  // カメラの映像をCanvasに複写（表示ではなくあくまで解析処理のため）
  ctx.drawImage(camera, 0, 0, camera.videoWidth, camera.videoHeight);

  // QRコードの読み取り
  const imageData = ctx.getImageData(0, 0, picture.width, picture.height);
  const code = jsQR(imageData.data, picture.width, picture.height);

  if (code) {
    // QRコードを発見したら
    // 結果を表示
    setQrRes(qrStr, code.data);
    // 見つかった箇所に線を引く
    drawLine(ctx, code.location);

    // video と canvas の表示を入れ替え
    camera.classList.add("hidden");
    picture.classList.remove("hidden");

    // カメラの停止
    camera.pause();

    // 再開ボタンを活性化
    resetBtn.disabled = false;
  } else {
    // 無ければ
    // 0.3秒後にもう一度チェックする
    setTimeout(checkPicture, 300);
  }
};

// 発見されたQRコードに線を引く
const drawLine = (ctx, pos, options = { color: "red", size: 3 }) => {
  // 線のスタイル設定
  ctx.strokeStyle = options.color;
  ctx.lineWidth = options.size;

  // 線を描く
  ctx.beginPath();
  ctx.moveTo(pos.topLeftCorner.x, pos.topLeftCorner.y);
  ctx.lineTo(pos.topRightCorner.x, pos.topRightCorner.y);
  ctx.lineTo(pos.bottomRightCorner.x, pos.bottomRightCorner.y);
  ctx.lineTo(pos.bottomLeftCorner.x, pos.bottomLeftCorner.y);
  ctx.lineTo(pos.topLeftCorner.x, pos.topLeftCorner.y);
  ctx.stroke();
};

// 読み取り結果を表示/非表示
const setQrRes = (elm, res) => (elm.innerHTML = res);
const clearQrRes = (elm) => (elm.innerHTML = "");

// リセットボタン
resetBtn.addEventListener("click", () => {
  // 結果欄をクリア
  clearQrRes(qrStr);

  // video と canvas の表示を入れ替え
  camera.classList.remove("hidden");
  picture.classList.add("hidden");

  // 再開ボタンを活性化
  resetBtn.disabled = true;

  // カメラ再開
  startCamera();
});
