import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-layout">
                <Navbar />
                <main className="content-body fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
