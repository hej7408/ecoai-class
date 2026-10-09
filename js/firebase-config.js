/* Firebase 연동 설정.
 * 이 값을 null 로 바꾸면 이 기기의 브라우저에만 저장하는 '로컬 모드'로 돌아갑니다.
 * (apiKey 는 비밀번호가 아니라 앱 식별용 값입니다. 실제 보호는 Firestore 보안 규칙이 담당합니다.)
 * 교사 가입 코드와 관리자 비밀번호는 이 파일이 아니라 Firebase 와 관리자 화면에서 정합니다.
 */
window.ECO_FIREBASE = {
  apiKey: 'AIzaSyAvrSA6c715rjqjkUYmgT6dOK3zyz9lhNE',
  authDomain: 'ecoai-class.firebaseapp.com',
  projectId: 'ecoai-class',
  storageBucket: 'ecoai-class.firebasestorage.app',
  messagingSenderId: '930622363445',
  appId: '1:930622363445:web:abb4a09685b85eaaca1e7c'
};
