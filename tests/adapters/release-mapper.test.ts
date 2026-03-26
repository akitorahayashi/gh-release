import { describe, expect, it } from 'vitest'
import {
  mapRelease,
  mapReleaseAsset,
} from '../../src/adapters/github/release-mapper'

describe('release mapper', () => {
  it('maps release API payload to repository release record', () => {
    const record = mapRelease({
      id: 101,
      tag_name: 'v1.0.0',
      upload_url: 'https://uploads.example',
      html_url: 'https://html.example',
      draft: true,
      prerelease: false,
      assets: [
        {
          id: 1,
          name: 'a.tgz',
          size: 10,
          content_type: 'application/gzip',
          browser_download_url: 'https://download.example/a.tgz',
        },
      ],
    })

    expect(record).toEqual({
      releaseId: 101,
      tagName: 'v1.0.0',
      uploadUrl: 'https://uploads.example',
      htmlUrl: 'https://html.example',
      draft: true,
      prerelease: false,
      assets: [
        {
          id: 1,
          name: 'a.tgz',
          size: 10,
          contentType: 'application/gzip',
          downloadUrl: 'https://download.example/a.tgz',
        },
      ],
    })
  })

  it('maps release asset payload to repository asset record', () => {
    expect(
      mapReleaseAsset({
        id: 2,
        name: 'b.tgz',
        size: 20,
        content_type: 'application/gzip',
        browser_download_url: 'https://download.example/b.tgz',
      }),
    ).toEqual({
      id: 2,
      name: 'b.tgz',
      size: 20,
      contentType: 'application/gzip',
      downloadUrl: 'https://download.example/b.tgz',
    })
  })
})
