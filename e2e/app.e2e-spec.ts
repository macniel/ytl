import { NodeVideoPage } from './app.po';

describe('node-video App', function() {
  let page: NodeVideoPage;

  beforeEach(() => {
    page = new NodeVideoPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
