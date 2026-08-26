import { Text, TextInput } from 'react-native';

const TextAny = Text as any;
const TextInputAny = TextInput as any;

TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.style = [{ fontFamily: 'Outfit-Regular' }, TextAny.defaultProps.style];

TextInputAny.defaultProps = TextInputAny.defaultProps || {};
TextInputAny.defaultProps.style = [{ fontFamily: 'Outfit-Regular' }, TextInputAny.defaultProps.style];
