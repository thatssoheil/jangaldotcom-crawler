import { run } from '../controllers/crawler';
import express from 'express';

const router = express.Router();

(async () => {
  let response = await run();
  console.log(response);
})();

// /* GET home page. */
// router.get('/', async function(req, res, next) {
//   let response = await run();
//   return res.send(response);
// });

module.exports = router;
