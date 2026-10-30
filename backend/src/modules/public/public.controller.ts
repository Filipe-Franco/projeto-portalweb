import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createVolunteerApplication,
  listContent,
  listDonationLocations,
  listFaq,
  listGallery,
  listInterestAreas,
  listPublicDonations,
  listPublicEvents,
  listPortalCoordination,
  listTeamMembers,
} from './public.service.js';

export const listContentController = asyncHandler(async (req, res) => {
  const content = await listContent(req.query);
  res.json({ data: content });
});

export const listTeamMembersController = asyncHandler(async (req, res) => {
  const members = await listTeamMembers();
  res.json({ data: members });
});

export const listPortalCoordinationController = asyncHandler(async (req, res) => {
  const members = await listPortalCoordination();
  res.json({ data: members });
});

export const listPublicEventsController = asyncHandler(async (req, res) => {
  const events = await listPublicEvents(req.query);
  res.json({ data: events });
});

export const listInterestAreasController = asyncHandler(async (req, res) => {
  const areas = await listInterestAreas();
  res.json({ data: areas });
});

export const createVolunteerController = asyncHandler(async (req, res) => {
  const result = await createVolunteerApplication(req.body);
  res.status(201).json(result);
});

export const listFaqController = asyncHandler(async (req, res) => {
  const faq = await listFaq();
  res.json({ data: faq });
});

export const listPublicDonationsController = asyncHandler(async (req, res) => {
  const donations = await listPublicDonations(req.query);
  res.json({ data: donations });
});

export const listDonationLocationsController = asyncHandler(async (req, res) => {
  const locations = await listDonationLocations(req.query);
  res.json({ data: locations });
});

export const listGalleryController = asyncHandler(async (req, res) => {
  const gallery = await listGallery(req.query);
  res.json({ data: gallery });
});
