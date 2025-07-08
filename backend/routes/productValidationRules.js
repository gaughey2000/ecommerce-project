const { productValidationRules } = require('../middleware/validation/productValidation');
const { validate } = require('../middleware/validation/validate');

router.post('/', auth, requireRole('admin'), productValidationRules, validate, addProduct);
router.put('/:id', auth, requireRole('admin'), productValidationRules, validate, updateProduct);