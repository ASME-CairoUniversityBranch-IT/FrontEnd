import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  AcademicDepartmentItem,
  AcademicDirectoryPage,
  AcademicDirectoryService,
  AcademicFacultyItem,
  AcademicUniversityItem,
} from './academic-directory.service';
import { environment } from '../../../environments/environment';

describe('AcademicDirectoryService', () => {
  let service: AcademicDirectoryService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/academic-directory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AcademicDirectoryService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AcademicDirectoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should search universities with query parameters', () => {
    const mockPage: AcademicDirectoryPage<AcademicUniversityItem> = {
      items: [
        {
          id: 'u-1',
          englishName: 'Cairo University',
          arabicName: 'جامعة القاهرة',
          category: 'Public',
          isOther: false,
          isActive: true,
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      hasNextPage: false,
    };

    service.getUniversities('Cairo', 1, 20).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].englishName).toBe('Cairo University');
    });

    const req = httpMock.expectOne(`${baseUrl}/universities?page=1&pageSize=20&search=Cairo`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should fetch faculties for a given university', () => {
    const mockPage: AcademicDirectoryPage<AcademicFacultyItem> = {
      items: [
        {
          offeringId: 'off-1',
          facultyId: 'fac-1',
          universityId: 'u-1',
          englishName: 'Faculty of Engineering',
          arabicName: 'كلية الهندسة',
          isOther: false,
          isActive: true,
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      hasNextPage: false,
    };

    service.getFaculties('u-1').subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].englishName).toBe('Faculty of Engineering');
    });

    const req = httpMock.expectOne(`${baseUrl}/universities/u-1/faculties?page=1&pageSize=20`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should fetch departments for a given offering', () => {
    const mockPage: AcademicDirectoryPage<AcademicDepartmentItem> = {
      items: [
        {
          id: 'dep-1',
          offeringId: 'off-1',
          universityId: 'u-1',
          englishName: 'Mechanical Power Engineering',
          arabicName: 'هندسة القوى الميكانيكية',
          isOther: false,
          isActive: true,
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      hasNextPage: false,
    };

    service.getDepartments('off-1').subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].englishName).toBe('Mechanical Power Engineering');
    });

    const req = httpMock.expectOne(`${baseUrl}/university-faculties/off-1/departments?page=1&pageSize=20`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });
});
