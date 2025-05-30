// const rateLimit = require("express-rate-limit");
// const NodeCache = require("node-cache"); // 이미 package.json에 포함됨

// // 사용자 ID를 기반으로 한 사용자별 제한을 위한 캐시 저장소
// const userLimitStore = new NodeCache({
//   stdTTL: 3600, // 1시간 유효 기간
//   checkperiod: 120 // 2분마다 만료된 항목 확인
// });

// // 유저별 속도 제한 미들웨어 생성 함수
// const createUserRateLimiter = (options) => {
//   return rateLimit({
//     windowMs: options.windowMs || 60 * 60 * 1000, // 기본 1시간
//     max: options.max || 100, // 기본 요청 제한 수
//     standardHeaders: true, 
//     legacyHeaders: false,
//     message: { error: options.message || '요청 제한에 도달했습니다. 나중에 다시 시도해주세요.' },
//     // 중요: 유저 ID를 키로 사용
//     keyGenerator: (req) => {
//       // 인증된 사용자인 경우 userId 사용, 그렇지 않으면 IP 주소 사용
//       return req.userId || req.ip;
//     },
//     // 커스텀 저장소 구현
//     store: {
//       // 요청 수 증가
//       increment: function(key) {
//         const current = userLimitStore.get(key) || 0;
//         userLimitStore.set(key, current + 1);
//         return Promise.resolve();
//       },
//       // 현재 요청 수 조회
//       decrement: function(key) {
//         const current = userLimitStore.get(key) || 0;
//         if (current > 0) userLimitStore.set(key, current - 1);
//         return Promise.resolve();
//       },
//       // 요청 수 초기화
//       resetKey: function(key) {
//         userLimitStore.set(key, 0);
//         return Promise.resolve();
//       },
//       // 요청 수 확인
//       resetAll: function() {
//         userLimitStore.flushAll();
//         return Promise.resolve();
//       },
//       // 현재 요청 횟수 조회
//       get: function(key) {
//         const hits = userLimitStore.get(key) || 0;
//         return Promise.resolve({
//           totalHits: hits,
//           resetTime: Date.now() + options.windowMs
//         });
//       }
//     }
//   });
// };

// // 유저별 채팅 요청 제한 (1시간에 20회)
// const userChatLimiter = createUserRateLimiter({
//   windowMs: 60 * 60 * 1000, // 1시간
//   max: 20, // 사용자당 1시간에 20회 요청 제한
//   message: '채팅 요청 제한에 도달했습니다. 1시간 후에 다시 시도해주세요.'
// });

// // 유저별 검색 요청 제한 (1시간에 20회)
// const userSearchLimiter = createUserRateLimiter({
//   windowMs: 60 * 60 * 1000, // 1시간
//   max: 20, // 사용자당 1시간에 20회 요청 제한
//   message: '검색 요청 제한에 도달했습니다. 1시간 후에 다시 시도해주세요.'
// });

// // 유저별 일정 생성 요청 제한 (1시간에 5회)
// const userItineraryLimiter = createUserRateLimiter({
//   windowMs: 60 * 60 * 1000, // 1시간
//   max: 5, // 사용자당 1시간에 5회 요청 제한
//   message: '일정 생성 요청 제한에 도달했습니다. 1시간 후에 다시 시도해주세요.'
// });

// // 기존 IP 기반 제한기는 유지
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15분
//   max: 100, // IP당 15분에 100회 요청 제한
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { error: "너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요." }
// });

// module.exports = {
//   globalLimiter,
//   userChatLimiter,
//   userSearchLimiter,
//   userItineraryLimiter
// };