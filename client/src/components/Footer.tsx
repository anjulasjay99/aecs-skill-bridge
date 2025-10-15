function Footer() {
  return (
    <footer className="bg-white py-8 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-row flex-wrap justify-between">
          <div className="mb-8 md:mb-0">
            <div className="text-blue-600 font-bold text-xl mb-4">EVENTPAL</div>
            <p className="text-gray-600 text-sm max-w-xs">
              Our vision is to provide convenience and help increase your sales
              business.
            </p>
            <p className="text-gray-500 text-xs mt-8">
              ©2025 Event Pal. All rights reserved
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 md:w-2/3">
            <div>
              <h3 className="font-medium text-gray-800 mb-4">About</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Featured
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Partnership
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Business Relation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-4">Community</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Events
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Podcast
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Invite a friend
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-4">Socials</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 text-sm hover:text-gray-800"
                  >
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <a href="#" className="text-gray-600 text-sm mr-6">
            Privacy & Policy
          </a>
          <a href="#" className="text-gray-600 text-sm">
            Terms & Condition
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
