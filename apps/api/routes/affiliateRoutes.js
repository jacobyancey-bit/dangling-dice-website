import express from 'express';
import { redirectPartner, getPartnerDirectory } from '../controllers/affiliateController.js';

const router = express.Router();

// Public partner directory and redirect routes
router.get('/', getPartnerDirectory);
router.get('/redirect/:slug', redirectPartner);

export default router;

