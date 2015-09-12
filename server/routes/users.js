import express from 'express';
/* eslint new-cap: 0 */
const router = express.Router();

/* GET users listing. */
/* eslint-disable no-unused-vars */
router.get('/', (req, res, next) => {
  /* eslint-enable no-unused-vars */
  res.send('respond with a resource');
});

export default router;
