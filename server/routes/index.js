import express from 'express';
/* eslint new-cap: 0 */
const router = express.Router();

/* GET home page. */
/* eslint-disable no-unused-vars */
router.get('/', (req, res, next) => {
  /* eslint-enable no-unused-vars */
  res.render('index', { title: 'Express' });
});

export default router;
