import Joi from '@hapi/joi'
import { ISpecLabel } from '../labels/SpecLabel'

const nameSchema = Joi.string()
  .min(1)
  .max(50)
  .required()

const labelSchema = Joi.object({
  name: nameSchema,

  color: Joi.string()
    .max(32)
    .required(),// TODO: Validate color

  aliases: Joi.array()
    .items(nameSchema)
    .optional()
    .default([]),

  description: Joi.string()
    .min(0)
    .max(100)
    .optional()
    .default('')
})

const labels = Joi.array().items(labelSchema)

function validate(data: ISpecLabel) {
  const validationSchema = Array.isArray(data) ? labels : labelSchema
  return validationSchema.validate<ISpecLabel>(data)
}

export default validate
