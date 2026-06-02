import {useEffect, useState } from 'react';
import { getValidApiUrl } from '../services/urlService';


export default function Test() {

    const [status, setStatus] = useState('Fetching...');
    useEffect(() => {
    const checkServerStatus = async () => {
        try {
        const API_URL = await getValidApiUrl();
        const res = await fetch(`${API_URL}/brew-coffee`);
        setStatus(res)
        } catch (error) {
        res = "Error"
        }
    };
    checkServerStatus();
    }, []);


    return(
        <div>
            {status}
        </div>
    )
}