import Storage from '../src/Storage';

const _ = require('lodash');
const expect = require('unexpected');

describe('Storage.Configurations', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  const component = process.env.KBC_COMPONENT;
  const config1 = `c1-${_.random(1000, 9000)}`;
  it('create', async () => {
    await expect(storage.request('get', `components/${component}/configs/${config1}`), 'to be rejected');

    const configId = await expect(storage.Configurations.create(component, config1, {
      configuration: {
        test: true,
      },
    }), 'to be fulfilled');

    const res = await expect(storage.request('get', `components/${component}/configs/${configId}`), 'to be fulfilled');
    expect(res, 'to have key', 'configuration');
    expect(res.configuration, 'to have key', 'test');
    expect(res.configuration.test, 'to be', true);

    await storage.request('delete', `components/${component}/configs/${configId}`);
  });

  const config2 = `c2-${_.random(1000, 9000)}`;
  it('get', async () => {
    await expect(storage.Configurations.get(component, config2), 'to be rejected');

    await storage.request(
      'post',
      `components/${component}/configs`,
      {
        configurationId: config2,
        name: config2,
        configuration: JSON.stringify({ test: true }),
      }
    );

    const res = await expect(storage.Configurations.get(component, config2), 'to be fulfilled');
    expect(res, 'to have key', 'configuration');
    expect(res.configuration, 'to have key', 'test');
    expect(res.configuration.test, 'to be', true);

    await storage.request('delete', `components/${component}/configs/${config2}`);
  });

  const config3 = `c3-${_.random(1000, 9000)}`;
  it('delete', async () => {
    await storage.request(
      'post',
      `components/${component}/configs`,
      {
        configurationId: config3,
        name: config3,
      }
    );

    await expect(storage.Configurations.delete(component, config3), 'to be fulfilled');

    await expect(storage.request('get', `components/${component}/configs/${config1}`), 'to be rejected');
  });
});
