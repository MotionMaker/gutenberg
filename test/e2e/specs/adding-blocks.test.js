/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

describe( 'adding blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	/**
	 * Given a Puppeteer ElementHandle, clicks below its bounding box.
	 *
	 * @param {Puppeteer.ElementHandle} elementHandle Element handle.
	 *
	 * @return {Promise} Promise resolving when click occurs.
	 */
	async function clickBelow( elementHandle ) {
		const box = await elementHandle.boundingBox();
		const x = box.x + ( box.width / 2 );
		const y = box.y + box.height + 1;
		return page.mouse.click( x, y );
	}

	it( 'Should insert content using the placeholder and the regular inserter', async () => {
		// Click below editor to focus last field (block appender)
		await clickBelow( await page.$( '.editor-default-block-appender' ) );
		expect( await page.$( '[data-type="core/paragraph"]' ) ).not.toBeNull();

		// Up to return back to title. Assumes that appender results in focus
		// to a new block.
		// TODO: Backspace should be sufficient to return to title.
		await page.keyboard.press( 'ArrowUp' );

		// Post is empty, the newly created paragraph has been removed on focus
		// out because default block is provisional.
		expect( await page.$( '[data-type="core/paragraph"]' ) ).toBeNull();

		// Using the placeholder
		await page.click( '.editor-default-block-appender' );
		await page.keyboard.type( 'Paragraph block' );

		// Using the slash command
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/quote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Quote block' );

		// Using the regular inserter
		await page.click( '.edit-post-header [aria-label="Add block"]' );
		await page.waitForSelector( '.editor-inserter__menu' );
		await page.keyboard.type( 'code' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Code block' );

		// Unselect blocks to avoid conflicts with the inbetween inserter
		await page.click( '.editor-post-title__input' );

		// Using the between inserter
		const insertionPoint = await page.$( '[data-type="core/quote"] .editor-block-list__insertion-point-button' );
		const rect = await insertionPoint.boundingBox();
		await page.mouse.move( rect.x + ( rect.width / 2 ), rect.y + ( rect.height / 2 ) );
		await page.click( '[data-type="core/quote"] .editor-block-list__insertion-point-button' );
		await page.keyboard.type( 'Second paragraph' );

		// Switch to Text Mode to check HTML Output
		await page.click( '.edit-post-more-menu [aria-label="More"]' );
		const codeEditorButton = ( await page.$x( '//button[contains(text(), \'Code Editor\')]' ) )[ 0 ];
		await codeEditorButton.click( 'button' );

		// Assertions
		const textEditorContent = await page.$eval( '.editor-post-text-editor', ( element ) => element.value );

		expect( textEditorContent ).toMatchSnapshot();
	} );
} );
