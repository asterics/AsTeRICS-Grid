import { Model } from '../externals/objectmodel';

class WordForm extends Model({
    lang: [String],
    tags: [Model.Array(String)],
    value: [String],
    pronunciation: [String]
}) {}

WordForm.defaults({
    tags: [],
    value: ''
});

export { WordForm };
