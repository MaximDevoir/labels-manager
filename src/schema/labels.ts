import Joi from '@hapi/joi'

const labelSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required(),

  color: Joi.string()
    .max(32)
    .required(),

  description: Joi.string()
    .min(0)
    .max(100)
    .default('')
})

const labels = Joi.array().items(labelSchema)


function validate(data: Array<Object> | Object) {
  const validationSchema = Array.isArray(data) ? labels : labelSchema

  return Joi.validate(data, validationSchema)
}

export default validate
