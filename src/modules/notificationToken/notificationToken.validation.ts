/* eslint-disable prettier/prettier */
import Joi from 'joi';
import { objectId } from '../validate';

export const storeNotificationToken = {
  body: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

// This validation is kept for backward compatibility but the controller function has been modified
export const getNotificationTokensByUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
};

export const deleteNotificationToken = {
  params: Joi.object().keys({
    tokenId: Joi.string().custom(objectId).required(),
  }),
};