import axios from 'axios';
import { ResponseSchema } from './schemas';
import { URL } from './utils';

export const fetchFonts = async () => {
    const res = await axios.get(URL);
    return ResponseSchema.parse(res.data);
};
