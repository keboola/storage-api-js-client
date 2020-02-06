import aws from 'aws-sdk';
import expect from 'unexpected';
import Storage from '../src/Storage';

aws.config.setPromisesDependency(Promise);

describe('Storage.Files', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  it('prepare', () => storage.Files.prepare('test.csv', true)
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'name');
      expect(res, 'to have key', 'url');
      expect(res.name, 'to be', 'test.csv');
      return res.id;
    })
    .then((id) => storage.request('delete', `files/${id}`)));

  it('get', () => storage.request('post', 'files/prepare', { name: 'test.txt', federationToken: 1 })
    .then((file) => {
      const s3 = new aws.S3({
        accessKeyId: file.uploadParams.credentials.AccessKeyId,
        secretAccessKey: file.uploadParams.credentials.SecretAccessKey,
        sessionToken: file.uploadParams.credentials.SessionToken,
      });
      return s3.putObject({
        Bucket: file.uploadParams.bucket,
        Key: file.uploadParams.key,
        Body: Buffer.from('abcdefgh'),
      }).promise()
        .then(() => file.id);
    })
    .then((id) => storage.Files.get(id, true)
      .then(() => storage.request('delete', `files/${id}`))));
});
