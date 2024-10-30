/* eslint-disable prettier/prettier */
import Joi from 'joi';
import { objectId } from '../validate';

export const categories = {
  body: Joi.object().keys({
    categoryName: Joi.string().required(),
    description: Joi.string(),
  }),
};

export const updateCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    categoryName: Joi.string(),
    description: Joi.string(),
  }),
};

export const deleteCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId),
  }),
};
