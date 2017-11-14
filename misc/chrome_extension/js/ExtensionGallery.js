/*
 *	EXTENSION GALLERY
 */

/*global chrome, Coveo, TEST_CONFIG, resetTestEnv */

class ExtensionGallery {

  /**
   * Sets up the javascript for the modal
   */
  static setupModal() {

    let svgButtonHTML = `<svg height='18' width='18' style='position: absolute; top:50%; transform:translate(-50%, -50%);'>
          <polygon points='0,0 0,18 18,9' style='fill:#f58020;'></polygon>
          Search
        </svg>`;

    $('#__search > div.coveo-search-section > div > a').html(svgButtonHTML);

    // Get the modal
    let modal = $('#__extensionsGalleryModal');

    // Get the <span> element that closes the modal
    let span = $('.__close');

    // When the user clicks the button, open the modal
    $('#__modalButton').on('click', function () {
      modal.css('display', 'block');
    });

    let hideModal = () => {
      modal.css('display', 'none');
    };

    // When the user clicks on <span> (x), close the modal
    for (var i = 0; i < span.length; i++) {
      var element = span[i];
      $(element).on('click', hideModal);
    }

    // When the user clicks anywhere outside of the modal, close it
    modal.on('click', function (event) {
      if (event.target === modal[0]) {
        modal.css('display', 'none');
      }
    });

  }


  /**
    * The onclick function for the extension search result link
    *
    * @param {event} e - The event
    * @param {object} result - The search result
    */
  static onClick(e, result) {
    let title = result.title;
    let description = result.raw.extdescription;
    let reqData = result.raw.extrequired;
    let uniqueId = result.uniqueId;

    ExtensionGallery.setAceEditorValue('');

    $('#BodyTextDataStream, #BodyHTMLDataStream, #ThumbnailDataStream, #FileBinaryStream').attr('checked', false);
    $('#ExtensionName, #ExtensionDescription').val('');

    if (uniqueId) {
      $.get(`${TEST_CONFIG.platformUrl}/rest/search/v2/html?organizationId=extensions&uniqueId=${uniqueId}&access_token=${TEST_CONFIG.apiKey}`,
        function (data) {
          ExtensionGallery.setAceEditorValue($(data).contents()[4].innerHTML);
        }
      );
    }
    if (title) {
      $('#ExtensionName').val(title);
    }
    if (description) {
      $('#ExtensionDescription').val(description);
    }
    if (reqData) {
      let itemToIdMap = {
        'Body text': '#BodyTextDataStream',
        'Body HTML': '#BodyHTMLDataStream',
        'Thumbnail': '#ThumbnailDataStream',
        'Original file': '#FileBinaryStream'
      };
      reqData.split(';').forEach(itemData => {
        let id = itemToIdMap[itemData];
        if (id) {
          // if 'Body text' is in reqData, check the #BodyTextDataStream
          $(id).attr('checked', true);
        }
      });
    }
    $('#__extensionsGalleryModal').css('display', 'none');
  }


  /**
   * Creates the modal componant of the page along with the button
   */
  static createModal() {
    //Get the HTML data
    $.get(chrome.extension.getURL('/html/extension-search.html'), searchForExtensionHtml => {
      let searchPageAndAddButton = $(searchForExtensionHtml);
      $('#EditExtensionComponent form .column:last-child').prepend(searchPageAndAddButton);

      //Init the Coveo search
      var root = document.getElementById('__search');
      Coveo.SearchEndpoint.endpoints['extensions'] = new Coveo.SearchEndpoint({
        restUri: `${TEST_CONFIG.platformUrl}/rest/search`,
        accessToken: TEST_CONFIG.apiKey
      });
      Coveo.init(root, {
        ResultLink: {
          onClick: (e, result) => {
            e.preventDefault();
            resetTestEnv();
            ExtensionGallery.onClick(e, result);
          }
        }
      });

      ExtensionGallery.setupModal();
    });
  }

  /**
   * Adds the select with options to the page after 350 ms the edit modal started appearing
   */
  static addExtensionSearchToPage() {
    if (window._addExtensionSearchToPage_timeout_ref) {
      clearTimeout(window._addExtensionSearchToPage_timeout_ref);
    }
    window._addExtensionSearchToPage_timeout_ref = setTimeout(()=>{
      window._addExtensionSearchToPage_timeout_ref = null;

      //If its opening
      if ($('#EditExtensionComponent').length && !$('#__modalButton')[0]) {
        ExtensionGallery.createModal();
      }
    }, 350);
  }

  /**
   * Sets the value of the ace editor by injecting JS into the main page
   * https://stackoverflow.com/questions/3955803/page-variables-in-content-script
   * @param {string} stringToSet - The string to set
   */
  static setAceEditorValue(stringToSet) {
    let scriptContent = `window.ace.edit('AceCodeEditor').setValue(\`${stringToSet}\`)`;

    let script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    $('#tmpScript').remove();
  }

}
