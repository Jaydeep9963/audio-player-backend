import express, { Router } from 'express';
import upload from '../../multerConfig';
import { validate } from '../../modules/validate';
import { authValidation, authController } from '../../modules/auth';
import { categoryController, categoryValidation } from '../../modules/category';
import { subCategoryController, subCategoryValidation } from '../../modules/subCategory';
import { audioController } from '../../modules/audio';
import authenticateToken from './authenticationMiddleware';
import { privacyPolicyController } from '../../modules/privacyPolicy';
import { termAndConditionController } from '../../modules/term&condition';
// import { auth } from '../../modules/auth';
import { artistController } from '../../modules/artist';
// Add these imports at the top with other imports
import { aboutUsController } from '../../modules/aboutUs';
import { feedbackController } from '../../modules/feedback';
import { notificationTokenController } from '../../modules/notificationToken';

const router: Router = express.Router();

// Authentication routes
router.post('/login', upload.none(), validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);

// Category routes
router.get('/overview', authenticateToken, categoryController.getTotalNumbers);
router.get('/categories', authenticateToken, categoryController.getCategories);
router.post(
  '/categories',
  authenticateToken,
  upload.single('image'),
  validate(categoryValidation.categories),
  categoryController.addCategory
);
router.put(
  '/categories/:categoryId',
  authenticateToken,
  upload.single('image'),
  validate(categoryValidation.updateCategory),
  categoryController.updateCategory
);
router.delete(
  '/categories/:categoryId',
  authenticateToken,
  validate(categoryValidation.deleteCategory),
  categoryController.deleteCategory
);

// SubCategory routes
router.get('/subcategories', authenticateToken, subCategoryController.getSubCategories);
router.post(
  '/subcategories',
  authenticateToken,
  upload.single('image'),
  validate(subCategoryValidation.subcategories),
  subCategoryController.addSubCategory
);
router.put(
  '/subcategories/:subCategoryId',
  authenticateToken,
  upload.single('image'),
  validate(subCategoryValidation.updateSubCategory),
  subCategoryController.updateSubCategory
);
router.delete(
  '/subcategories/:subCategoryId',
  authenticateToken,
  validate(subCategoryValidation.deleteCategory),
  subCategoryController.deleteSubCategory
);

// Audio routes
router.get('/audios', authenticateToken, audioController.getAudios);
router.post(
  '/audios',
  authenticateToken,
  upload.fields([
    { name: 'audio', maxCount: 1 }, // audio file
    { name: 'lyrics', maxCount: 1 }, // lyrics file
    { name: 'image', maxCount: 1 }, // image file
  ]),
  audioController.addAudio
);
router.put(
  '/audios/:audioId',
  authenticateToken,
  upload.fields([
    { name: 'audio', maxCount: 1 }, // audio file
    { name: 'lyrics', maxCount: 1 }, // lyrics file
    { name: 'image', maxCount: 1 }, // image file
  ]),
  audioController.updateAudio
);
router.delete('/audios/:audioId', authenticateToken, audioController.deleteAudio);

// Artist routes
router.get('/artists', authenticateToken, artistController.getArtists);
router.post('/artists', authenticateToken, upload.single('image'), artistController.addArtist);
router.get('/artists/:artistId', authenticateToken, artistController.getArtistById);
router.get('/artists/:artistId/songs', authenticateToken, artistController.getArtistSongs);

// Privacy Policy routes
router.get('/privacy-policy', authenticateToken, upload.none(), privacyPolicyController.getPrivacyPolicy);
router.post('/privacy-policy', authenticateToken, upload.none(), privacyPolicyController.postPrivacyPolicy);
router.delete('/privacy-policy', authenticateToken, upload.none(), privacyPolicyController.deletePrivacyPolicy);

// Terms and Conditions routes
router.get('/termAndCondition', authenticateToken, upload.none(), termAndConditionController.getTac);
router.post('/termAndCondition', authenticateToken, upload.none(), termAndConditionController.postTac);
router.delete('/termAndCondition', authenticateToken, upload.none(), termAndConditionController.deleteTac);

// About Us routes (admin)
router.get('/about-us', authenticateToken, upload.none(), aboutUsController.getAboutUs);
router.post('/about-us', authenticateToken, upload.none(), aboutUsController.postAboutUs);
router.delete('/about-us', authenticateToken, upload.none(), aboutUsController.deleteAboutUs);

// Feedback routes (admin)
router.get('/feedback', authenticateToken, feedbackController.getAllFeedback);

// Notification Token routes (admin)
router.get('/notification-tokens', authenticateToken, notificationTokenController.getAllNotificationTokens);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register as user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid email or password
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserWithTokens'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: An email will be sent to reset password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: fake@example.com
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               password: password1
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Password reset failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Password reset failed
 */

/**
 * @swagger
 * /auth/send-verification-email:
 *   post:
 *     summary: Send verification email
 *     description: An email will be sent to verify email.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: verify email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verify email token
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: verify email failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: verify email failed
 */

export default router;
