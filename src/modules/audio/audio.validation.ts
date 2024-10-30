/* eslint-disable prettier/prettier */
import Joi from 'joi';
import { objectId } from '../validate';

export const subcategories = {
  body: Joi.object().keys({
    subCategoryName: Joi.string().required(),
    categoryId: Joi.string().required(),
    description: Joi.string(),
  }),
};

export const updateSubCategory = {
  params: Joi.object().keys({
    subCategoryId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    subCategoryName: Joi.string(),
    categoryId: Joi.string(),
    description: Joi.string(),
  }),
};

export const deleteCategory = {
  params: Joi.object().keys({
    subCategoryId: Joi.string().custom(objectId).required(),
  }),
};
