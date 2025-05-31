import React, { useState } from 'react';
import commonStyles from './common.module.css';

const TemperatureConverter: React.FC = () => {
    const [celsius, setCelsius] = useState<string>('');
    const [fahrenheit, setFahrenheit] = useState<string>('');
    const [error, setError] = useState<string>('');

    // 摂氏から華氏へ変換
    const convertCelsiusToFahrenheit = (c: number): number => {
        return (c * 9/5) + 32;
    };

    // 華氏から摂氏へ変換
    const convertFahrenheitToCelsius = (f: number): number => {
        return (f - 32) * 5/9;
    };

    const handleCelsiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setCelsius(value);
        setError('');

        if (value === '') {
            setFahrenheit('');
            return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setError('摂氏には数値を入力してください。');
            setFahrenheit('');
        } else {
            const converted = convertCelsiusToFahrenheit(numValue);
            setFahrenheit(Math.round(converted * 100) / 100 + ''); // 丸めて文字列に
        }
    };

    const handleFahrenheitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFahrenheit(value);
        setError('');

        if (value === '') {
            setCelsius('');
            return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setError('華氏には数値を入力してください。');
            setCelsius('');
        } else {
            const converted = convertFahrenheitToCelsius(numValue);
            setCelsius(Math.round(converted * 100) / 100 + ''); // 丸めて文字列に
        }
    };

    return (
        <div className={commonStyles.toolContainer}>
            <h2>温度変換ツール</h2>
            <form> {/* Removed onSubmit as it's not used here */}
                <div className={commonStyles.formGroup}>
                    <label htmlFor="celsius">摂氏 (°C):</label>
                    <input
                        type="text"
                        id="celsius"
                        value={celsius}
                        onChange={handleCelsiusChange}
                        placeholder="例: 25"
                        className={commonStyles.formInput}
                    />
                </div>
                <div className={commonStyles.formGroup}>
                    <label htmlFor="fahrenheit">華氏 (°F):</label>
                    <input
                        type="text"
                        id="fahrenheit"
                        value={fahrenheit}
                        onChange={handleFahrenheitChange}
                        placeholder="例: 77"
                        className={commonStyles.formInput}
                    />
                </div>
            </form>

            {error && (
                <div className={commonStyles.errorArea}>
                    {error}
                </div>
            )}
             <p className={commonStyles.infoText}>
                片方の値を入力すると、もう片方の値が自動的に計算されます。
            </p>
        </div>
    );
};

export default TemperatureConverter;
