/**
 * PoweredBy Component
 * Shows Human Passport and Nillion logos
 */

export function PoweredBy() {
  return (
    <div className="powered-by">
      <p className="powered-by-text">Powered by</p>
      <div className="powered-by-logos">
        <a
          href="https://app.passport.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="powered-by-logo"
        >
          <img
            src="/assets/human-passport-logo.svg"
            alt="Human Passport"
            className="logo-passport"
          />
        </a>
        <span className="logo-separator">&</span>
        <a
          href="https://nillion.com"
          target="_blank"
          rel="noopener noreferrer"
          className="powered-by-logo powered-by-logo-nillion"
        >
          <img
            src="/assets/nillion-logo.svg"
            alt="Nillion"
            className="logo-nillion"
          />
        </a>
      </div>
    </div>
  );
}
