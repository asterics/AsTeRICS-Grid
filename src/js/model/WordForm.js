import { Model } from '../externals/objectmodel';

class WordForm extends Model({
    lang: [String],
    tags: [Model.Array(String)],
    value: [String]
}) {}

WordForm.defaults({
    tags: [],
    value: ''
});

export { WordForm };
