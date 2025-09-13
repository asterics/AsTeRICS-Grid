import { Model } from '../externals/objectmodel';

class WordForm extends Model({
    lang: [String],
    tags: [Model.Array(String)],
    value: [String],
    pronunciation: [String],
    isPrefix: [Boolean],
    isSuffix: [Boolean]
}) {}

WordForm.defaults({
    tags: [],
    value: '',
    isPrefix: false,
    isSuffix: false
});

export { WordForm };
