import { CreateProjectComponent } from './create-project';
import { ProjectType, SponsorshipTier } from '../../../core/models/project.model';

describe('CreateProjectComponent multipart media mapping', () => {
  function createComponent(): CreateProjectComponent {
    const component = new CreateProjectComponent(
      {} as never,
      {} as never,
      {} as never,
      { detectChanges: () => undefined } as never,
    );

    component.mode = 'edit';
    component.selectedType = ProjectType.Event;
    component.title = 'Media mapping test';
    component.shortDescription = 'Regression test';
    component.longDescription = 'Regression test';
    component.location = 'Cairo';
    component.date = '2026-08-27';
    component.time = '12:00';
    return component;
  }

  it('pairs each uploaded file with its entry index instead of sending empty placeholders', () => {
    const component = createComponent();

    component.speakers = [
      { id: 'speaker-1', name: 'First', title: '', shortBio: '', photoUrl: '/old-1.png', photoPreview: '/old-1.png', photoFile: null, removePhoto: false },
      { id: 'speaker-2', name: 'Second', title: '', shortBio: '', photoUrl: null, photoPreview: 'data:image/png;base64,c2Vjb25k', photoFile: new File(['second'], 'second.png', { type: 'image/png' }), removePhoto: false },
    ];
    component.sponsors = [
      { id: 'sponsor-1', name: 'First sponsor', sponsorshipTier: SponsorshipTier.Gold, photoUrl: null, photoPreview: null, photoFile: null, removePhoto: false },
      { id: 'sponsor-2', name: 'Second sponsor', sponsorshipTier: SponsorshipTier.Silver, photoUrl: null, photoPreview: 'data:image/png;base64,c3BvbnNvcg==', photoFile: new File(['sponsor'], 'sponsor.png', { type: 'image/png' }), removePhoto: false },
    ];
    component.partners = [
      { id: 'partner-1', name: 'First partner', partnerType: '', isMainPartner: false, photoUrl: null, photoPreview: null, photoFile: null, removePhoto: false },
      { id: 'partner-2', name: 'Second partner', partnerType: '', isMainPartner: false, photoUrl: null, photoPreview: null, photoFile: null, removePhoto: false },
      { id: 'partner-3', name: 'Third partner', partnerType: '', isMainPartner: false, photoUrl: null, photoPreview: 'data:image/png;base64,cGFydG5lcg==', photoFile: new File(['partner'], 'partner.png', { type: 'image/png' }), removePhoto: false },
    ];

    const formData = (component as any).buildFormData() as FormData;

    expect(formData.getAll('SpeakerPhotoIndexes')).toEqual(['1']);
    expect(formData.getAll('SponsorPhotoIndexes')).toEqual(['1']);
    expect(formData.getAll('PartnerPhotoIndexes')).toEqual(['2']);
    expect((formData.getAll('SpeakerPhotos')[0] as File).name).toBe('second.png');
    expect((formData.getAll('SponsorPhotos')[0] as File).name).toBe('sponsor.png');
    expect((formData.getAll('PartnerPhotos')[0] as File).name).toBe('partner.png');
  });

  it('preserves existing entity ids while omitting unchanged photos', () => {
    const component = createComponent();
    component.speakers = [
      { id: 'speaker-existing', name: 'Existing speaker', title: 'Engineer', shortBio: '', photoUrl: '/existing.png', photoPreview: '/existing.png', photoFile: null, removePhoto: false },
    ];

    const formData = (component as any).buildFormData() as FormData;
    const speakers = JSON.parse(String(formData.get('Speakers')));

    expect(speakers[0].id).toBe('speaker-existing');
    expect(formData.getAll('SpeakerPhotos')).toHaveLength(0);
    expect(formData.getAll('SpeakerPhotoIndexes')).toHaveLength(0);
  });

  it('requires only a title and short description, and omits an unset main date', () => {
    const component = createComponent();
    component.date = '';
    component.location = '';
    component.coverImage = null;

    expect(component.requiredRemaining).toBe(0);

    const formData = (component as any).buildFormData() as FormData;
    expect(formData.has('MainDateAndTime')).toBe(false);
  });
});
