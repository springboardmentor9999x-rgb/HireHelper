const express = require('express');
const router = express.Router();

const requestController = require('../controllers/request.controller');
const authMiddleware = require('../middleware/auth.middleware');


router.use(authMiddleware);


router.post('/', requestController.sendRequest);


router.get('/my', requestController.getMyRequests);


router.get('/received', requestController.getReceivedRequests);


router.put('/accept/:requestId', requestController.acceptRequest);

router.put('/reject/:requestId', requestController.rejectRequest);

module.exports = router;