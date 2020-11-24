import React from 'react'
import { PropTypes } from 'prop-types';
import MainMenu from './../MainMenu/MainMenu';
import Footer from './../Footer/Footer';

const MainLayout = ({ children }) => (
  <div>
    <MainMenu />
    {children}
    <Footer />
  </div>
);

MainLayout.propTypes = {
  children: PropTypes.any,
}

export default MainLayout;
