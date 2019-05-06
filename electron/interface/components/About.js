import React from 'react';

class About extends React.Component {
  render() {
    const appIconPath = `file://${window.dirname}/icons/wallet/icon2x.png`;
    const appName = 'EOS Wallet';

    return (
      <div className="row popup-windows about">
        <div className="col col-4 ">
          <img
            className={`left-overlay wallet`}
            src={appIconPath}
            style={{
              position: 'relative',
              top: '-40px',
              left: '-132%',
              width: '255%'
            }}
          />
        </div>
        <div className="col col-8 ">
          <h1>{appName}</h1>
          <p>
            Version {window.mist.version}
            <br />
            License {window.mist.license}
            <br />
          </p>
          <small>Copyright 2018 ZB.COM</small>
        </div>
      </div>
    );
  }
}

export default About;
