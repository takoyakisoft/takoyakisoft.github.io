import React from 'react';
import TemperatureConverter from '../components/TemperatureConverter';
import { Link } from 'react-router-dom';
import styles from './ToolPage.module.css';

const TemperaturePage: React.FC = () => {
    return (
        <div className={styles.toolPageContainer}>
            <TemperatureConverter />
            <div className={styles.backLinkContainer}>
                <Link to="/" className={styles.backLink}>ホームページに戻る</Link>
            </div>
        </div>
    );
};

export default TemperaturePage;
