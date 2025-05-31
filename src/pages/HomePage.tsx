import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
    return (
        <div className={styles.homePage}>
            <h1>ようこそ！ウェブツール集へ</h1>
            <p>便利なオンラインユーティリティのコレクションです。</p>
            <nav>
                <ul className={styles.toolList}>
                    <li>
                        <Link to="/bmi-calculator" className={styles.toolLink}>
                            BMI計算機
                        </Link>
                    </li>
                    <li>
                        <Link to="/temperature-converter" className={styles.toolLink}>
                            温度変換ツール
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default HomePage;
