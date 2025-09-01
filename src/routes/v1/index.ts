import express, { Router } from 'express';
import authRoute from './admin.route';
// import docsRoute from './swagger.route';
import userRoute from './user.route';
// import config from '../../config/config';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/admin',
    route: authRoute,
  },
  {
    path: '/user',
    route: userRoute,
  },
];

// const devIRoute: IRoute[] = [
//   // IRoute available only in development mode
//   {
//     path: '/docs',
//     route: docsRoute,
//   },
// ];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
// if (config.env === 'development') {
//   devIRoute.forEach((route) => {
//     router.use(route.path, route.route);
//   });
// }

// Add this import
import { artistRoute } from '../../modules/artist';

// Add this route
router.use('/artists', artistRoute);

export default router;
