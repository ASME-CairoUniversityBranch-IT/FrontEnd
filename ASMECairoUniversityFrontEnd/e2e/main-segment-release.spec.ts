import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const apiOrigin = 'https://asmecairouniversity.runasp.net';
const schemaId = '11111111-1111-4111-8111-111111111111';
const questionId = '22222222-2222-4222-8222-222222222222';
const registrationId = '33333333-3333-4333-8333-333333333333';
const universityId = '44444444-4444-4444-8444-444444444444';
const offeringId = '55555555-5555-4555-8555-555555555555';
const departmentId = '66666666-6666-4666-8666-666666666666';

const publicEdition = {
  id: '77777777-7777-4777-8777-777777777777',
  year: 2026,
  slug: 'main-segment-2026',
  title: 'Main Segment 2026: Engineering Horizons',
  heroContent: 'One day where engineering insight becomes a career path.',
  heroImageUrl: null,
  storyContent: 'Main Segment connects students with engineers, mentors, and employers.',
  startsAt: '2026-10-15T09:00:00Z',
  endsAt: '2026-10-15T18:00:00Z',
  location: 'Faculty of Engineering, Cairo University',
  registration: {
    isAvailable: true,
    opensAt: '2026-09-01T00:00:00Z',
    closesAt: '2026-10-10T23:59:59Z',
    capacity: 500,
  },
  sections: [
    {
      sectionKey: 'PanelDiscussion',
      displayOrder: 1,
      intro: 'Leaders discuss the future of engineering work.',
      programItems: [
        {
          id: 'panel-1',
          category: 'PanelDiscussion',
          title: 'Engineering the Next Decade',
          description: 'A grounded industry conversation.',
          startsAt: '2026-10-15T10:00:00Z',
          endsAt: '2026-10-15T11:00:00Z',
          location: 'Main Hall',
          people: [
            {
              id: 'person-1',
              name: 'Dr. Sara Hassan',
              jobTitle: 'Engineering Director',
              shortBio: 'Mechanical engineer and industry leader.',
              photoUrl: null,
              linkedInUrl: null,
            },
          ],
        },
      ],
      organizations: [],
    },
    {
      sectionKey: 'Sponsors',
      displayOrder: 2,
      intro: 'Organizations making the experience possible.',
      programItems: [],
      organizations: [
        { id: 'sponsor-1', name: 'Alpha', category: 'Sponsor', logoUrl: null, websiteUrl: null, sponsorTier: 'Gold' },
        { id: 'sponsor-2', name: 'Beta', category: 'Sponsor', logoUrl: null, websiteUrl: null, sponsorTier: 'Gold' },
      ],
    },
  ],
};

const adminEdition = {
  ...publicEdition,
  status: 'Published',
  isRegistrationAvailable: true,
  publishedAt: '2026-08-29T10:00:00Z',
  archivedAt: null,
  registrationOpensAt: publicEdition.registration.opensAt,
  registrationClosesAt: publicEdition.registration.closesAt,
  capacity: 500,
  registrationAvailabilityOverride: true,
  careerFairIntro: 'Meet teams hiring engineering talent.',
  cvReviewAndMockInterviewsIntro: 'Practice with company reviewers.',
  sections: publicEdition.sections.map((section, index) => ({
    id: `section-${index + 1}`,
    sectionKey: section.sectionKey,
    isVisible: true,
    displayOrder: section.displayOrder,
  })),
  programItems: [],
  people: [],
  organizations: [],
};

function schema(status: 'Draft' | 'Published' = 'Draft') {
  return {
    id: schemaId,
    schemaId,
    editionYear: 2026,
    version: 2,
    status,
    createdAt: '2026-08-29T10:00:00Z',
    publishedAt: status === 'Published' ? '2026-08-29T11:00:00Z' : null,
    questions: [
      {
        id: questionId,
        key: 'expectations',
        prompt: 'What do you expect from Main Segment 2026?',
        helperText: 'One concise sentence is enough.',
        type: 'ShortText',
        isRequired: true,
        isActive: true,
        displayOrder: 1,
        minLength: 2,
        maxLength: 300,
        minSelections: null,
        maxSelections: null,
        condition: null,
        options: [],
      },
    ],
  };
}

const academicPage = (items: unknown[]) => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
  hasNextPage: false,
});

function registrationDetail(status = 'Submitted') {
  return {
    id: registrationId,
    editionYear: 2026,
    reference: 'MS26-0001',
    status,
    submittedAt: '2026-09-10T10:00:00Z',
    nameEnglish: 'Ahmed Mohamed Ali',
    nameArabic: 'أحمد محمد علي',
    email: 'ahmed@example.com',
    phoneNumber: '01012345678',
    gender: 'Male',
    nationalIdMasked: '3010101*******',
    university: 'Cairo University',
    faculty: 'Faculty of Engineering',
    department: 'Mechanical Engineering',
    universityOtherValue: null,
    facultyOtherValue: null,
    departmentOtherValue: null,
    graduationYear: 2027,
    answers: [
      {
        questionId,
        questionKey: 'expectations',
        prompt: 'What do you expect from Main Segment 2026?',
        type: 'ShortText',
        answerJson: JSON.stringify('Industry connections'),
        optionsSnapshotJson: null,
      },
    ],
    documents: [
      { documentType: 'NationalIdPhoto', displayName: 'National ID', contentType: 'image/png', byteSize: 68 },
      { documentType: 'UniversityIdPhoto', displayName: 'University ID', contentType: 'image/png', byteSize: 68 },
      { documentType: 'Cv', displayName: 'CV', contentType: 'application/pdf', byteSize: 12 },
    ],
    statusHistory: [],
  };
}

async function mockApi(page: Page) {
  let editionCreated = false;
  let editionStatus = 'Draft';
  let published = false;
  let submitted = false;
  let currentStatus = 'Submitted';

  await page.route(`${apiOrigin}/**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/api/admin/main-segments' && method === 'GET') {
      return json(
        editionCreated
          ? [
              {
                id: adminEdition.id,
                year: 2026,
                slug: adminEdition.slug,
                title: adminEdition.title,
                status: editionStatus,
                startsAt: adminEdition.startsAt,
                endsAt: adminEdition.endsAt,
                isRegistrationAvailable: true,
              },
            ]
          : [],
      );
    }
    if (path === '/api/admin/main-segments' && method === 'POST') {
      editionCreated = true;
      editionStatus = 'Draft';
      return json({ ...adminEdition, status: editionStatus, isRegistrationAvailable: false }, 201);
    }
    if (path === '/api/admin/main-segments/2026' && method === 'GET') {
      return json({ ...adminEdition, status: editionStatus });
    }
    if (path === '/api/admin/main-segments/2026/status' && method === 'PATCH') {
      editionStatus = request.postDataJSON().status;
      return json({ ...adminEdition, status: editionStatus });
    }
    if (path === '/api/admin/main-segments/2026/registration-schema' && method === 'GET') return json(schema(published ? 'Published' : 'Draft'));
    if (path.includes(`/registration-schemas/${schemaId}/questions/${questionId}`) && method === 'PUT') return json(schema('Draft'));
    if (path.endsWith(`/registration-schemas/${schemaId}/publish`) && method === 'POST') {
      published = true;
      return json(schema('Published'));
    }
    if (path === '/api/main-segments/2026' && method === 'GET') return json(publicEdition);
    if (path === '/api/main-segments/2026/registration-schema' && method === 'GET') return json(schema('Published'));
    if (path === '/api/academic-directory/universities' && method === 'GET') {
      return json(academicPage([{ id: universityId, englishName: 'Cairo University', arabicName: 'جامعة القاهرة', category: 'Public', isOther: false, isActive: true }]));
    }
    if (path === `/api/academic-directory/universities/${universityId}/faculties` && method === 'GET') {
      return json(academicPage([{ offeringId, facultyId: offeringId, universityId, englishName: 'Faculty of Engineering', arabicName: 'كلية الهندسة', isOther: false, isActive: true }]));
    }
    if (path === `/api/academic-directory/university-faculties/${offeringId}/departments` && method === 'GET') {
      return json(academicPage([{ id: departmentId, offeringId, universityId, englishName: 'Mechanical Engineering', arabicName: 'الهندسة الميكانيكية', isOther: false, isActive: true }]));
    }
    if (path === '/api/main-segments/2026/registrations' && method === 'POST') {
      expect(request.headers()['idempotency-key']).toBeTruthy();
      submitted = true;
      return json({ referenceNumber: 'MS26-0001', status: 'Submitted', submittedAt: '2026-09-10T10:00:00Z', editionYear: 2026 }, 201);
    }
    if (path === '/api/admin/main-segments/2026/registrations/summary' && method === 'GET') {
      return json({ total: submitted ? 1 : 0, counts: { Submitted: submitted && currentStatus === 'Submitted' ? 1 : 0, UnderReview: currentStatus === 'UnderReview' ? 1 : 0 } });
    }
    if (path === '/api/admin/main-segments/2026/registrations' && method === 'GET') {
      return json({
        items: submitted ? [{ id: registrationId, reference: 'MS26-0001', status: currentStatus, submittedAt: '2026-09-10T10:00:00Z', nameEnglish: 'Ahmed Mohamed Ali', nameArabic: 'أحمد محمد علي', email: 'ahmed@example.com', phoneNumber: '01012345678', university: 'Cairo University', faculty: 'Faculty of Engineering', graduationYear: 2027 }] : [],
        totalCount: submitted ? 1 : 0,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      });
    }
    if (path === `/api/admin/main-segments/2026/registrations/${registrationId}` && method === 'GET') return json(registrationDetail(currentStatus));
    if (path.endsWith(`/registrations/${registrationId}/status`) && method === 'PATCH') {
      currentStatus = request.postDataJSON().status;
      return json({ id: registrationId, status: currentStatus, updatedAt: '2026-09-10T11:00:00Z' });
    }
    if (path.includes(`/registrations/${registrationId}/documents/`) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
    }
    if (path === '/api/admin/main-segments/2026/registrations/export' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'text/csv', headers: { 'content-disposition': 'attachment; filename="registrations.csv"' }, body: 'reference,status\nMS26-0001,UnderReview\n' });
    }
    return json({ message: `Unhandled mock route: ${method} ${path}` }, 500);
  });
}

async function authenticateAdmin(page: Page) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, role: 'admin' })).toString('base64url');
  await page.addInitScript(({ token }) => {
    localStorage.setItem('asme_auth_token', token);
    localStorage.setItem('asme_auth_user', JSON.stringify({ userId: 'admin-1', email: 'admin@example.com', name: 'Release Admin' }));
  }, { token: `eyJhbGciOiJub25lIn0.${payload}.signature` });
}

async function expectNoSeriousAxeFindings(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test('admin publish → public registration → admin review, document, status, and export', async ({ page }) => {
  await authenticateAdmin(page);
  await mockApi(page);

  await page.goto('/admin/main-segment');
  await page.getByRole('button', { name: /CREATE NEW EDITION/ }).click();
  const createDialog = page.getByRole('dialog', { name: 'Create Main Segment Edition' });
  await createDialog.getByLabel('Edition Year').fill('2026');
  await createDialog.getByLabel('Edition Title').fill('Main Segment 2026: Engineering Horizons');
  await createDialog.getByLabel('Hero Content').fill('One day where engineering insight becomes a career path.');
  await createDialog.getByLabel('Story Narrative (Why Main Segment Matters)').fill('Main Segment connects students with engineers, mentors, and employers.');
  await createDialog.getByRole('button', { name: 'Create & Open Workspace' }).click();
  await expect(page).toHaveURL(/\/admin\/main-segment\/2026$/);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'PUBLISH LIVE' }).click();
  await expect(page.getByText('Edition is now Published.')).toBeVisible();

  await page.getByRole('button', { name: 'REGISTRATION FORM' }).click();
  await expect(page.getByText('SCHEMA VERSION 2')).toBeVisible();
  await expectNoSeriousAxeFindings(page);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'PUBLISH LIVE SCHEMA' }).click();
  await expect(page.getByText('Schema v2 published live.')).toBeVisible();

  await page.goto('/main-segment/2026');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Engineering Horizons');
  await page.getByRole('button', { name: 'Register for Main Segment 2026' }).first().click();

  const dialog = page.getByRole('dialog', { name: 'Registration Application' });
  await expect(dialog).toBeVisible();
  await expectNoSeriousAxeFindings(page);
  await dialog.getByLabel('Full Name in English').fill('Ahmed Mohamed Ali');
  await dialog.getByLabel('Full Name in Arabic').fill('أحمد محمد علي');
  await dialog.getByLabel('Email Address').fill('ahmed@example.com');
  await dialog.getByLabel('Egyptian Phone Number').fill('01012345678');
  await dialog.getByLabel('Egyptian National ID Number').fill('30101011234567');
  const fileInputs = dialog.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles({ name: 'national-id.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgo=', 'base64') });
  await fileInputs.nth(1).setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await dialog.getByRole('button', { name: /Continue to Education/ }).click();

  await dialog.getByRole('option', { name: /Cairo University/ }).click();
  await dialog.getByRole('option', { name: /Faculty of Engineering/ }).click();
  await dialog.getByRole('option', { name: /Mechanical Engineering/ }).click();
  await dialog.getByLabel('Expected Graduation Year').fill('2027');
  await dialog.locator('input[type="file"]').setInputFiles({ name: 'university-id.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgo=', 'base64') });
  await dialog.getByRole('button', { name: /Continue to Questions/ }).click();
  await dialog.getByRole('textbox', { name: 'What do you expect from Main Segment 2026?' }).fill('Industry connections');
  await dialog.getByLabel(/I confirm that all submitted details/).check();
  await dialog.getByRole('button', { name: 'SUBMIT REGISTRATION' }).click();
  await expect(dialog.getByText('MS26-0001')).toBeVisible();

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toContain('30101011234567');
  expect(stored).not.toContain('Industry connections');
  expect(stored).not.toContain('national-id.png');
  expect(stored).not.toContain('cv.pdf');
  expect(stored).not.toContain('/documents/');
  expect(stored).not.toContain('objectKey');

  await page.goto('/admin/main-segment/2026');
  await page.getByRole('button', { name: 'REGISTRATIONS' }).click();
  await expect(page.getByText('MS26-0001')).toBeVisible();
  await page.getByRole('button', { name: /^Review/ }).click();
  await expect(page.getByRole('dialog', { name: /Ahmed Mohamed Ali/ })).toBeVisible();
  await expectNoSeriousAxeFindings(page);

  await page.getByRole('button', { name: /View National ID Photo/ }).click();
  await expect(page.getByRole('dialog', { name: /National ID/ })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByLabel('Application Status').selectOption('UnderReview');
  await page.getByLabel('Internal Audit / Review Note').fill('Documents verified');
  await page.getByRole('button', { name: 'Save Status Update' }).click();
  await expect(page.getByText(/status updated/i)).toBeVisible();
  await page.getByRole('button', { name: 'Close detail view' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /EXPORT CSV/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('registrations');
});

test('public page has no serious accessibility findings or horizontal overflow at release widths', async ({ page }) => {
  const requestedPaths: string[] = [];
  page.on('request', (request) => requestedPaths.push(new URL(request.url()).pathname));
  await mockApi(page);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/main-segment/2026');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }

  const sponsorStages = page.locator('.sponsor-logo-stage');
  await expect(sponsorStages).toHaveCount(2);
  const boxes = await sponsorStages.evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(boxes[0]).toEqual(boxes[1]);
  expect(requestedPaths.some((path) => path.includes('/api/admin/'))).toBe(false);
  expect(requestedPaths.some((path) => path.includes('/documents/'))).toBe(false);

  await expectNoSeriousAxeFindings(page);
});

test('registration dialog traps focus, restores focus, and honors reduced motion', async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/main-segment/2026');
  const trigger = page.getByRole('button', { name: 'Register for Main Segment 2026' }).first();
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Registration Application' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Close registration dialog' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: /Continue to Education/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close registration dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(trigger).toBeVisible();

  const durations = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector('.ms-primary-cta')!);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  });
  expect(['0.01ms', '1e-05s']).toContain(durations.animation);
  expect(['0.01ms', '1e-05s']).toContain(durations.transition);
});
